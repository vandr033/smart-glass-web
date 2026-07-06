"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, ShieldCheck, Trash2, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { QUERY_KEYS } from "@/lib/constants";
import { CRITICAL_ADMIN_PERMISSIONS } from "@/lib/permission-catalog";
import { getRoleDescription } from "@/modules/roles/localization";
import { PermissionMatrix } from "@/modules/roles/permission-matrix";
import { roleService } from "@/services/role-service";
import { getApiErrorMessage } from "@/utils";

type RoleDetailProps = {
  roleId: string;
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function RoleDetail({ roleId }: RoleDetailProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const roleQuery = useQuery({
    queryFn: () => roleService.getRoleById(roleId),
    queryKey: QUERY_KEYS.roleDetails(roleId),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => roleService.deleteRole(roleId),
    onSuccess: async () => {
      setActionError(null);
      setIsDeleteDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roles,
      });
      window.location.assign("/roles");
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  if (roleQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void roleQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={roleQuery.error.message}
        title="No se pudo cargar este registro de rol"
      />
    );
  }

  const role = roleQuery.data;
  const canEdit = permissions.includes("system.roles.update");
  const canDelete = permissions.includes("system.roles.update");

  if (!role) {
    return (
      <section className="rounded-lg border border-stone-300/70 bg-white/90 p-6 text-sm text-stone-600 shadow-[0_18px_44px_rgba(15,47,91,0.06)]">
        Cargando detalles del rol...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[var(--color-primary)] p-4 text-blue-100">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Registro del rol
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {role.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5">
                  <Users className="h-4 w-4" />
                  {role.usersCount} usuario{role.usersCount === 1 ? "" : "s"} asignado{role.usersCount === 1 ? "" : "s"}
                </span>
                {role.isAdmin ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-900">
                    Rol administrador protegido
                  </span>
                ) : null}
              </div>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {getRoleDescription(role.name, role.description)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href="/roles"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a roles
            </Link>
            {canEdit ? (
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-primary-hover)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
                href={`/roles/${role.id}/edit`}
              >
                <Pencil className="h-4 w-4" />
                Editar rol
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Permisos
          </p>
          <div className="mt-5">
            <PermissionMatrix
              helperText={
                role.isAdmin
                  ? "Los permisos criticos del administrador permanecen bloqueados para que el sistema no pierda el acceso total."
                  : undefined
              }
              lockedPermissionNames={role.isAdmin ? CRITICAL_ADMIN_PERMISSIONS : []}
              permissionNames={role.permissions}
              readOnly
            />
          </div>
        </section>

        <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Metadatos del registro
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Usuarios asignados
              </dt>
              <dd className="mt-2 font-medium text-stone-900">{role.usersCount}</dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Creado el
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(role.createdAt)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Actualizado el
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(role.updatedAt)}
              </dd>
            </div>
          </dl>

          {canDelete ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={role.isAdmin}
                onClick={() => {
                  setIsDeleteDialogOpen(true);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                {role.isAdmin ? "El rol administrador esta protegido" : "Eliminar rol"}
              </button>
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-4 rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel="Eliminar rol"
        description={`Eliminar ${role.name} y retirar su acceso asignado de los registros activos?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
        }}
        open={isDeleteDialogOpen}
        title="¿Eliminar este rol?"
        tone="danger"
      />
    </div>
  );
}
